
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import { scheduleNotificationChain, scheduleProtectionActiveNotification, cancelUserNotifications } from '@/lib/task-manager';
import type { Dose } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscriptionId, action, payload } = body;

        if (!subscriptionId || !action) {
            return NextResponse.json({ message: 'Missing subscriptionId or action' }, { status: 400 });
        }

        const stateRef = firestore.collection('states').doc(subscriptionId);
        const stateDoc = await stateRef.get();
        let currentState = stateDoc.exists ? stateDoc.data() : { doses: [], sessionActive: false };

        await cancelUserNotifications(subscriptionId); // Always clear old tasks before starting new ones

        switch (action) {
            case 'start': {
                const newDose: Dose = {
                    time: new Date(payload.time),
                    pills: 2,
                    type: 'start',
                    id: new Date().toISOString(),
                };
                const newState = {
                    doses: [newDose],
                    sessionActive: true,
                };
                await stateRef.set(newState);

                await scheduleProtectionActiveNotification(subscriptionId, newDose.time);
                await scheduleNotificationChain(subscriptionId, newDose.time);
                break;
            }

            case 'dose': {
                if (!currentState || !currentState.sessionActive) {
                    return NextResponse.json({ message: 'No active session found.' }, { status: 400 });
                }
                const newDose: Dose = {
                    time: new Date(payload.time),
                    pills: payload.pills,
                    type: 'dose',
                    id: new Date().toISOString(),
                };
                const updatedDoses = [...(currentState.doses || []), newDose].sort((a,b) => (a.time as unknown as Timestamp).toMillis() - (b.time as unknown as Timestamp).toMillis());
                await stateRef.update({ doses: updatedDoses });
                
                await scheduleNotificationChain(subscriptionId, newDose.time);
                break;
            }

            case 'end': {
                 if (!currentState || !currentState.sessionActive) {
                    return NextResponse.json({ message: 'No active session found.' }, { status: 400 });
                }
                await stateRef.update({ sessionActive: false });
                // All tasks were already cancelled at the start of the function.
                break;
            }

            case 'clear': {
                await stateRef.delete();
                await firestore.collection('subscriptions').doc(subscriptionId).delete();
                // All tasks were already cancelled at the start of the function.
                break;
            }

            default:
                return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('Dose API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
