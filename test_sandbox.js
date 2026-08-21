
async function run() {
  const res = await fetch('http://localhost:3001/api/admin/discovery/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_string: 'topic:rag stars:>500' })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
