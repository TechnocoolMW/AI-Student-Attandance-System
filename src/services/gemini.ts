import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function identifyStudent(
  frameBase64: string,
  students: Student[]
): Promise<{ studentId: string | null; confidence: number }> {
  if (students.length === 0) return { studentId: null, confidence: 0 };

  const model = "gemini-3-flash-preview";
  
  // We'll send the live frame and a description of the students we're looking for.
  // For better accuracy, we could send student photos too, but let's start with a prompt-based approach
  // where we describe the gallery if it's small, or just ask it to identify based on visual similarity
  // if we provide the gallery as context.
  
  const studentListText = students.map(s => `ID: ${s.studentId}, Name: ${s.name}`).join("\n");

  const prompt = `
    You are an AI Student Attendance System. 
    Attached is a frame from a classroom camera.
    Below is a list of registered students:
    ${studentListText}
    
    Your task:
    1. Look at the face(s) in the image.
    2. Match the face to one of the registered students.
    3. Return the studentId of the person identified.
    4. If you are not sure or the person is not in the list, return "Unknown".
    5. Return ONLY a JSON object with the following structure:
    {
      "studentId": "the_id_or_Unknown",
      "confidence": 0.0 to 1.0
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: frameBase64.split(",")[1] || frameBase64
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      studentId: result.studentId === "Unknown" ? null : result.studentId,
      confidence: result.confidence || 0
    };
  } catch (error) {
    console.error("Gemini Identification Error:", error);
    return { studentId: null, confidence: 0 };
  }
}
