
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Jobs API not implemented yet' },
    { status: 501 }
  )
}
