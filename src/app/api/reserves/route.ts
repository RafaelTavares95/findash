import { NextResponse } from 'next/server';
import path from 'path';
import { readJson, writeJson } from '@/lib/jsonStorage';

const DATA_PATH = path.join(process.cwd(), 'data', 'reserves.json');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const allReserves = await readJson<any[]>(DATA_PATH, []);
    
    // Filter reserves by userId
    const userReserves = allReserves.filter((res: any) => res.userId === userId);
      
    return NextResponse.json(userReserves);
  } catch (error) {
    console.error('Error reading reserves:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userReserves = await request.json();
    const allReserves = await readJson<any[]>(DATA_PATH, []);

    // Remove old reserves for this user and add the new ones
    const otherUsersReserves = allReserves.filter((res: any) => res.userId !== userId);
      
    const reservesWithId = userReserves.map((res: any) => ({
      ...res,
      userId: userId
    }));

    const updatedReserves = [...otherUsersReserves, ...reservesWithId];
    
    await writeJson(DATA_PATH, updatedReserves);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving reserves:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
