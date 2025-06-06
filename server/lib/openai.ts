import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getCropAdvice({ cropName, variety, context }: { cropName: string, variety: string, context?: string }) {

  console.log('context', context);

  const systemPrompt = `You are a highly knowledgeable gardening assistant. Given a crop name, variety, and context (such as 'microgreens', 'field', 'hydroponic'), respond ONLY with valid minified JSON (no markdown, no explanation, no comments) in the following structure:
{"growingDays": number,"specialInstructions": "...","commonIssues": ["..."]}

Adjust your answer based on context — for example, growing microgreens hydroponically requires different timing and care than growing mature crops in soil.

EXAMPLES:
Input: Crop: Peas
Variety: Sugar Snap
Context: field
Output: {"growingDays":65,"specialInstructions":"Direct sow in early spring. Provide trellis support. Keep soil moist. Harvest when pods are plump.","commonIssues":["Powdery mildew","Aphids"]}

Input: Crop: Basil
Variety: Genovese
Context: hydroponic
Output: {"growingDays":28,"specialInstructions":"Maintain water temp 20-25C, provide 14+ hours of light, harvest leaves regularly to encourage growth.","commonIssues":["Root rot","Downy mildew"]}

Input: Crop: Peas
Variety: Dun
Context: hydroponic microgreens
Output: {"growingDays":10,"specialInstructions":"Soak seeds overnight, spread densely on moist grow mat or medium, keep in dark for 3 days then expose to light, harvest shoots when 2-3 inches tall.","commonIssues":["Mold","Overwatering"]}
`;

  const userPrompt = `Crop: ${cropName}\nVariety: ${variety}\nContext: ${context || ""}`;

  async function fetchAdvice(prompt: string, user: string) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: user }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });
    return completion.choices[0]?.message?.content;
  }

  try {
    console.log('OpenAI prompt:', { systemPrompt, userPrompt });
    let response = await fetchAdvice(systemPrompt, userPrompt);
    console.log('OpenAI raw response:', response);
    if (!response) return null;
    try {
      return JSON.parse(response);
    } catch (err) {
      // Retry with a clarifying message if not valid JSON
      console.warn('First OpenAI response not valid JSON, retrying with clarification...');
      const retryPrompt = systemPrompt + '\n\nIMPORTANT: Respond ONLY with valid minified JSON, no markdown, no explanation.';
      response = await fetchAdvice(retryPrompt, userPrompt);
      console.log('OpenAI retry response:', response);
      if (!response) return null;
      try {
        return JSON.parse(response);
      } catch (err2) {
        console.error('Error parsing OpenAI retry response:', err2);
        return null;
      }
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return null;
  }
}
