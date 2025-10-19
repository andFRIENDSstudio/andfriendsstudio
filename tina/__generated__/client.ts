import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: 'http://localhost:4001/graphql', token: '082efe1a861019acf25a8c6348462be9514c305a', queries,  });
export default client;
  