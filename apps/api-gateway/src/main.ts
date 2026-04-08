import 'dotenv/config';
import { createGatewayApplication } from './gateway-bootstrap';

async function bootstrap() {
  const app = await createGatewayApplication();
  const portRaw = process.env.PORT ?? '3000';
  const port = Number.parseInt(portRaw, 10);
  await app.listen(Number.isNaN(port) ? 3000 : port);
}
void bootstrap();
