import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the schema for a single note
const NoteSchema = z.object({
  frequency: z.number().min(20).max(20000).describe("Frequency in Hz (20-20000)"),
  duration: z.number().min(0.01).max(10).describe("Duration in seconds (0.01-10)"),
  note_name: z.string().optional().describe("Optional note name like 'C4', 'F#5', etc."),
  is_rest: z.boolean().optional().describe("True if this is a rest/pause"),
});

// Define the schema for the complete arrangement
const ArrangementSchema = z.object({
  title: z.string().describe("Title or description of the musical arrangement"),
  tempo_bpm: z.number().min(60).max(200).describe("Tempo in beats per minute"),
  key_signature: z.string().describe("Key signature like 'C major', 'A minor', etc."),
  notes: z.array(NoteSchema).min(1).max(100).describe("Array of notes in sequence"),
  total_duration: z.number().describe("Total duration of the arrangement in seconds"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Create the system prompt for music generation
    const systemPrompt = `You are a musical composer AI that creates precise musical arrangements.

Given a user's musical request, generate a sequence of notes with exact frequencies and durations.

Guidelines:
- Use standard Western musical frequencies (A4 = 440Hz)
- Keep arrangements between 5-50 notes for playability
- Include rests (is_rest: true) for musical phrasing
- Use realistic durations (0.1-2.0 seconds typically)
- Match the requested style, tempo, and key
- For riffs/melodies, use repetition and variation
- For chord progressions, use appropriate harmonic intervals

Common frequency references:
- C4: 261.63 Hz, D4: 293.66 Hz, E4: 329.63 Hz, F4: 349.23 Hz
- G4: 392.00 Hz, A4: 440.00 Hz, B4: 493.88 Hz
- C5: 523.25 Hz, etc.

Always provide note_name when possible (e.g., "C4", "F#5").`;

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "musical_arrangement",
          schema: ArrangementSchema,
        },
      },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const arrangement = completion.choices[0]?.message?.parsed;

    if (!arrangement) {
      throw new Error('Failed to generate musical arrangement');
    }

    // Validate the generated arrangement
    const validatedArrangement = ArrangementSchema.parse(arrangement);

    return NextResponse.json({
      success: true,
      arrangement: validatedArrangement,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('Error generating musical arrangement:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid arrangement format',
          details: error.errors 
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate musical arrangement',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
