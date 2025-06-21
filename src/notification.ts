import axios from 'axios'
import { NOTIFICATION_API_TOKEN, NOTIFICATION_API_URL } from './config'

export async function sendNotification({
  to,
  message,
}: { to: string; message: string }): Promise<void> {
  await axios.post(
    NOTIFICATION_API_URL,
    { to, body: 'text', text: message },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NOTIFICATION_API_TOKEN}`,
      },
    },
  )
}
