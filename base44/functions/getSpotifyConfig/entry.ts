import { secrets } from "base44:runtime";

export default async function(req: Request): Promise<Response> {
  try {
    const clientId = secrets.get("SPOTIFY_CLIENT_ID");
    if (!clientId) {
      return Response.json({ configured: false });
    }
    return Response.json({ configured: true, clientId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}