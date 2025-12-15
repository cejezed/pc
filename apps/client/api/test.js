export default async function handler(req: any, res: any) {
  try {
    return res.status(200).json({ message: 'API works!' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
