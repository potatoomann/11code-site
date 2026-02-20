import { NextResponse } from 'next/server';
import { sendContactFormEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const success = await sendContactFormEmail(name, email, message);

        if (success) {
            return NextResponse.json({ message: 'Message sent successfully' });
        } else {
            return NextResponse.json(
                { error: 'Failed to send message' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Contact API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
