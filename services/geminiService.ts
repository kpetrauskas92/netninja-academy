
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

// Helper to determine if we can use AI
export const isAIEnabled = (): boolean => {
  return !!apiKey;
};

export const getExplanation = async (concept: string, context: string): Promise<string> => {
  if (!ai) return "Offline Mode: AI Uplink unavailable. Please verify your API credentials or continue in manual mode.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain the networking concept: ${concept} in the context of: ${context}. 
      Target audience: A complete beginner. 
      Tone: Encouraging and gamified (like a witty robot tutor). 
      Length: Under 60 words.`,
    });
    return response.text || "I couldn't decode that packet. Try again?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection to AI mainframe interrupted.";
  }
};

export const getSubnetBreakdown = async (ip: string, cidr: number, targetTask: string): Promise<string> => {
    if (!ai) return "Offline Mode: Calculation Engine is running locally. AI Hints are disabled.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
            You are an expert networking tutor. 
            Task: Provide a detailed, step-by-step calculation to find the **${targetTask}** for the IP address **${ip}/${cidr}**.

            Please structure your response exactly as follows:
            1. **Analyze the CIDR**: Explain how many bits are for the network vs host.
            2. **Binary Conversion**: Show the binary for the interesting octet (where the mask splits).
            3. **Logic Step**: Explain the bitwise logic used (e.g., ANDing for Network, ORing inverted mask for Broadcast).
            4. **Full Analysis**: Briefly list the computed Network Address, Broadcast Address, and Usable Host Range.
            
            Tone: Technical but beginner-friendly. Use concise bullet points.
            `,
        });
        return response.text || "Calculation incomplete.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Error retrieving detailed analysis.";
    }
};

export const getChatResponse = async (message: string, history: string[]): Promise<string> => {
    if (!ai) return "NetBot is currently offline. Please check your connection.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are "NetBot", a helpful AI teaching assistant for a networking game.
            Current User Conversation History: ${JSON.stringify(history)}
            User's latest question: ${message}
            
            Keep it brief, helpful, and fun. Focus on Binary, Hex, IP, and Subnetting.`,
        });
        return response.text || "No data received.";
    } catch (e) {
        return "Error communicating with the AI core.";
    }
}
