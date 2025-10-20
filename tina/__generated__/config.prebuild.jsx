// tina/config.ts
import { defineConfig } from "tinacms";

// tina/components/ProjectPreview.tsx
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
var ProjectPreview = (props) => {
  const containerRef = useRef(null);
  const cursorRef = useRef(null);
  const textElementRef = useRef(null);
  const textWrapperRef = useRef(null);
  const form = props.tinaForm;
  const values = form?.values || {};
  const projects = values.projects || [];
  const currentIndex = parseInt(props.field.name.match(/\d+/)?.[0] || "0");
  const project = projects[currentIndex] || {};
  const title = project.title || "Untitled Project";
  const contributors = project.contributors || [];
  const date = project.date || (/* @__PURE__ */ new Date()).toISOString();
  const image = project.image || "";
  const year = new Date(date).getFullYear().toString();
  useEffect(() => {
    if (!containerRef.current || !cursorRef.current || !textElementRef.current) return;
    const cursor = cursorRef.current;
    const textElement = textElementRef.current;
    const textWrapper = textWrapperRef.current;
    const card = containerRef.current.querySelector(".preview-card");
    let mouseX = 0;
    let mouseY = 0;
    const moveCursor = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const animateCursor = () => {
      gsap.to(cursor, {
        x: mouseX,
        y: mouseY,
        duration: 0.3,
        ease: "power2.out"
      });
      requestAnimationFrame(animateCursor);
    };
    const checkTextScroll = () => {
      setTimeout(() => {
        if (textElement && textWrapper && textElement.scrollWidth > textWrapper.clientWidth) {
          textElement.classList.add("scrolling");
          const originalHTML = textElement.innerHTML;
          textElement.innerHTML = originalHTML + " \u2022 " + originalHTML;
        } else {
          textElement?.classList.remove("scrolling");
        }
      }, 50);
    };
    const handleMouseEnter = () => {
      let attribution = "";
      if (contributors.length === 1) {
        attribution = ` \u2022 ${contributors[0]}`;
      } else if (contributors.length > 1) {
        attribution = ` \u2022 ${year}`;
      }
      cursor.classList.add("pill-state");
      textElement.innerHTML = `<strong>${title}</strong>${attribution}`;
      checkTextScroll();
      gsap.to(cursor, {
        width: 280,
        height: 60,
        borderWidth: 2,
        backgroundColor: "#000",
        duration: 0.4,
        ease: "power3.out"
      });
      gsap.to(textElement, { opacity: 1, duration: 0.3, delay: 0.1 });
    };
    const handleMouseLeave = () => {
      cursor.classList.remove("pill-state");
      gsap.to(cursor, {
        width: 12,
        height: 12,
        borderWidth: 0,
        backgroundColor: "#fff",
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(textElement, { opacity: 0, duration: 0.2 });
      textElement.classList.remove("scrolling");
      const textContent = textElement.textContent || "";
      if (textContent.includes(" \u2022 ")) {
        textElement.innerHTML = textContent.split(" \u2022 ")[0];
      }
    };
    if (card) {
      card.addEventListener("mouseenter", handleMouseEnter);
      card.addEventListener("mouseleave", handleMouseLeave);
    }
    containerRef.current?.addEventListener("mousemove", moveCursor);
    const rafId = animateCursor();
    return () => {
      if (card) {
        card.removeEventListener("mouseenter", handleMouseEnter);
        card.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(rafId);
    };
  }, [title, contributors, year, image]);
  return React.createElement("div", { style: { marginTop: "1rem", marginBottom: "2rem" } }, React.createElement("label", { style: {
    display: "block",
    marginBottom: "0.5rem",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333"
  } }, "Live Preview"), React.createElement(
    "div",
    {
      ref: containerRef,
      style: {
        position: "relative",
        width: "100%",
        height: "400px",
        backgroundColor: "#000",
        borderRadius: "8px",
        overflow: "hidden",
        cursor: "none"
      }
    },
    React.createElement(
      "div",
      {
        className: "preview-card",
        style: {
          width: "280px",
          height: "100%",
          margin: "0 auto",
          backgroundImage: image ? `url(${image})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }
      }
    ),
    React.createElement(
      "div",
      {
        ref: cursorRef,
        style: {
          position: "absolute",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference",
          border: "2px solid #fff",
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "translate(-50%, -50%)",
          width: "12px",
          height: "12px",
          backgroundColor: "#fff",
          overflow: "hidden",
          transition: "mix-blend-mode 0.3s ease"
        },
        className: "custom-cursor-preview"
      },
      React.createElement(
        "div",
        {
          style: {
            color: "#fff",
            fontSize: "14px",
            textAlign: "center",
            padding: "0 12px",
            whiteSpace: "nowrap",
            opacity: 0,
            lineHeight: "1.3",
            width: "100%",
            overflow: "hidden"
          }
        },
        React.createElement("div", { ref: textWrapperRef, style: { width: "100%", overflow: "hidden" } }, React.createElement("div", { ref: textElementRef, style: { display: "inline-block", whiteSpace: "nowrap" } }))
      )
    ),
    React.createElement("style", null, `
          .custom-cursor-preview.pill-state {
            mix-blend-mode: normal !important;
          }
          .preview-card {
            cursor: none !important;
          }
          .scrolling {
            animation: marquee-preview 8s linear infinite;
          }
          @keyframes marquee-preview {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `)
  ));
};

// tina/config.ts
var config_default = defineConfig({
  branch: "main",
  clientId: process.env.TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      {
        label: "Site Content",
        name: "content",
        path: "src/data",
        format: "json",
        ui: {
          global: true
        },
        match: {
          include: "projects"
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
              }
            },
            fields: [
              {
                type: "string",
                name: "title",
                label: "Project Title",
                required: true
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "datetime",
                name: "date",
                label: "Date"
              },
              {
                type: "string",
                name: "contributors",
                label: "Contributors",
                list: true
              },
              {
                type: "image",
                name: "image",
                label: "Project Image"
              },
              {
                type: "string",
                name: "tags",
                label: "Tags",
                list: true,
                options: ["motion", "installation", "graphic", "web"]
              },
              {
                type: "boolean",
                name: "featured",
                label: "Featured Project"
              },
              {
                type: "string",
                name: "client",
                label: "Client"
              },
              {
                type: "string",
                name: "url",
                label: "Project URL"
              },
              // Custom preview field
              {
                type: "string",
                name: "_preview",
                label: " ",
                ui: {
                  component: ProjectPreview
                }
              }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
