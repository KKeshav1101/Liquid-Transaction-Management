import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Transaction } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface InvestmentAdviceResponse {
    explanation: string;
    params: {
        principal: number;
        monthlyContribution: number;
        rate: number;
        years: number;
        name?: string;
    } | null;
}

export const analyzeInvestmentAction = async (
    userPrompt: string, 
    profile: UserProfile, 
    transactions: Transaction[]
): Promise<InvestmentAdviceResponse> => {
    
    // Construct User Context
    const monthlySpending = transactions
        .filter(t => t.type === 'EXPENSE' && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = ((profile.monthlyIncome - monthlySpending) / profile.monthlyIncome) * 100;

    const systemContext = `
    You are a professional financial assistant. 
    User Profile: 
    - Monthly Income: ₹${profile.monthlyIncome}
    - Current Savings Balance: ₹${profile.currentBalance}
    - Approx Monthly Spending: ₹${monthlySpending}
    - Est. Savings Rate: ${savingsRate.toFixed(1)}%
    
    Task:
    1. Analyze the user's investment idea described in the prompt.
    2. Extract parameters for a Compound Interest simulation (Principal, Monthly Contribution, Rate, Years). 
       - If user doesn't specify rate, estimate conservatively based on asset type (e.g., FD=7%, Nifty=12%, Stocks=15%).
       - If user doesn't specify duration, assume 5 years.
    3. Provide a structured, professional explanation in the 'explanation' field.
       
    Formatting Rules for 'explanation':
    - Do NOT write large paragraphs.
    - Use '### ' for section headers (e.g., ### Analysis, ### The Math, ### Verdict).
    - Use '* ' for bullet points to list pros/cons or details.
    - Wrap specific financial outcomes or key numbers in double underscores to request underlining (e.g., __₹15 Lakhs__, __High Risk__).
    - Keep it concise.

    Example Structure:
    ### Plan Analysis
    * You are looking at a mid-cap fund.
    * Historic returns are around 15%.
    
    ### Projected Outcome
    At 15% for 5 years, you will generate __₹8.5 Lakhs__ in interest.
    
    ### Recommendation
    This fits your budget. __Go for it.__
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemContext,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: { type: Type.STRING },
                        params: {
                            type: Type.OBJECT,
                            properties: {
                                principal: { type: Type.NUMBER, description: "Initial lump sum amount" },
                                monthlyContribution: { type: Type.NUMBER, description: "Monthly addition (SIP)" },
                                rate: { type: Type.NUMBER, description: "Annual interest rate in percentage" },
                                years: { type: Type.NUMBER, description: "Duration in years" },
                                name: { type: Type.STRING, description: "Short name of the plan" }
                            },
                            required: ["principal", "monthlyContribution", "rate", "years"]
                        }
                    },
                    required: ["explanation", "params"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as InvestmentAdviceResponse;
        }
        
        throw new Error("Empty response");

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            explanation: "### Error\nI couldn't process that request.\n\n### Troubleshooting\n* Check your connection.\n* Try a simpler prompt.",
            params: null
        };
    }
};