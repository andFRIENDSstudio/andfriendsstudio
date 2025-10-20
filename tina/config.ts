// @ts-nocheck
import { defineConfig } from "tinacms";
import { ProjectPreview } from "./components/ProjectPreview";

export default defineConfig({
  branch: "main",
  
  // Make sure these pull from env
  clientId: process.env.TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  
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
        label: "Site Content",
        name: "content",
        path: "src/data",
        format: "json",
        ui: {
          global: true,
        },
        match: {
          include: "projects",
        },
        fields: [
          {
            type: "object",
            name: "projects",
            label: "Projects",
            list: true,
            ui: {
              itemProps: (item) => {
                return { label: item?.title || "New Project" };
              },
            },
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
              },
              {
                type: "string",
                name: "contributors",
                label: "Contributors",
                list: true,
              },
              {
                type: "image",
                name: "image",
                label: "Project Image",
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
              // Custom preview field
              {
                type: "string",
                name: "_preview",
                label: " ",
                ui: {
                  component: ProjectPreview,
                },
              },
            ],
          },
        ],
      },
    ],
  },
});