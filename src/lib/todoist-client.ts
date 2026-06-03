const BASE = 'https://api.todoist.com/rest/v2'

function headers() {
  const token = process.env.TODOIST_API_TOKEN
  if (!token) throw new Error('TODOIST_API_TOKEN not set')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export const todoistClient = {
  getTasks:    ()             => fetch(`${BASE}/tasks`,              { headers: headers() }),
  getProjects: ()             => fetch(`${BASE}/projects`,           { headers: headers() }),
  closeTask:   (id: string)   => fetch(`${BASE}/tasks/${id}/close`,  { method: 'POST', headers: headers() }),
  createTask:  (content: string) => fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ content }),
  }),
}
