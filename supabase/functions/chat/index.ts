import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const INTERVIEWER_SYSTEM_PROMPT = `You are a friendly interviewer for the Mother Collective, gathering information about contributors' experiences and contributions to help with fair token allocation.

Your interview has three phases. Be conversational, not robotic. Ask follow-up questions when answers are vague. Don't ask all questions at once — have a natural conversation.

**Phase 1: Their Contribution**
- What was your role at Mother? When did you join and for how long were you active?
- What did you actually ship or deliver?
- Follow up on deliverables: "Is that work still being used today, or has it been replaced?"
- What's something you did that others might not know about?
- What blocked you or made your work harder?

**Phase 2: Peer Recognition**
- Who did you work with most closely? What did they contribute?
- Who do you think moved the needle the most (besides yourself)?
- Is there anyone whose contribution might be overlooked?
- After they mention a few people, ask: "Here are some others who contributed to Mother: James Young, Matt Wright, Disruption Joe, Alex Loomley, Manu, Zina, Punkar, Kush, Francesco, Dan, Sumit, Gita, Andrew. Anyone else you have observations about?"
- "In your view, who would you consider part of the core leadership team—the people steering the ship?"
- "Who would you consider key contributors—people who shipped important work but aren't necessarily in leadership?"
- "Is there anyone with a founding or leadership title who you feel is more advisory than hands-on?"

**Phase 3: Reflection**
- What would you do differently if starting over?
- Any concerns about how allocations should be determined?
- Anything else you want on the record?

**Special Cases:**
- If someone says they're new or didn't work closely with others, acknowledge that and focus more on Phase 1 and Phase 3. Don't pressure them to assess peers they don't know.
- If someone seems uncomfortable rating peers, reassure them: "It's okay to say you don't know or didn't work closely with someone."

**Guidelines:**
- Probe for specifics: "Can you give an example?" or "What was the outcome?"
- If they mention deliverables, always follow up with: "Is that work still being used today, or has it been replaced?"
- Thank them sincerely at the end
- Keep the tone warm and appreciative of their time

When they indicate they're done, summarize the key points you heard and ask if anything needs correction. Then let them know they can click "Submit Interview" when ready.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contributorId, message } = await req.json();
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select('role, content')
      .eq('contributor_id', contributorId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    await supabaseClient.from('messages').insert({ 
      contributor_id: contributorId, 
      role: 'user', 
      content: message 
    });

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: INTERVIEWER_SYSTEM_PROMPT,
      messages: [...messages, { role: 'user', content: message }],
    });

    const assistantMessage = claudeResponse.content[0].text;

    await supabaseClient.from('messages').insert({ 
      contributor_id: contributorId, 
      role: 'assistant', 
      content: assistantMessage 
    });

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
