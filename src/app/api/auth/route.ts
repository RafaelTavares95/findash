import { NextResponse } from 'next/server';
import path from 'path';
import { randomUUID } from 'crypto';
import { readJson, writeJson } from '@/lib/jsonStorage';

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json');

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const users = await readJson<any[]>(USERS_PATH, []);

    // Check if user already exists (case insensitive)
    let user = users.find((u: any) => u && u.name && u.name.toLowerCase() === name.toLowerCase());

    if (!user) {
      // Create new user
      user = {
        id: randomUUID(),
        name: name,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      await writeJson(USERS_PATH, users);
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error in auth API:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
