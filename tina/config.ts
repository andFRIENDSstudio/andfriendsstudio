// @ts-nocheck
import { defineConfig } from "tinacms";

export default defineConfig({
  branch: "master", // Change to "master" if that's your branch name
  
  clientId: 38f5cc0a-f76d-42d8-99c2-9f87deeaf2f3, // We'll get this from Tina Cloud in a sec
  token: 082efe1a861019acf25a8c6348462be9514c305a, // We'll get this too
  
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },
  
  schema: {
    collections: [
      {
        name: "project",
        label: "Projects",
        path: "src/data",
        format: "json",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Project Title",
            required: true,
          },
          {
            type: "string",
            name: "description",
            label: "Description",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
          },
          {
            type: "string",
            name: "contributors",
            label: "Contributors",
            list: true,
            required: true,
          },
          {
            type: "image",
            name: "image",
            label: "Project Image",
            required: true,
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
            options: ["motion", "installation", "graphic", "web"],
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured Project",
          },
          {
            type: "string",
            name: "client",
            label: "Client",
          },
          {
            type: "string",
            name: "url",
            label: "Project URL",
          },
        ],
      },
    ],
  },
});