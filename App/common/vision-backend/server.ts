import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

const client = new ImageAnnotatorClient({
  keyFilename: './../../acountservices.json', // Asegúrate de colocar la ruta correcta a tu archivo JSON
});

app.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    const [result] = await client.textDetection(image);
    const detections = result.textAnnotations;
    res.json(detections);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error analyzing image');
  }
});

app.listen(port, () => {
  //console.log(`Server running on port ${port}`);
});