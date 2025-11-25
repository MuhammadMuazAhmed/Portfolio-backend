import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { contactMessageSchema } from "./shared/schema.js";
import nodemailer from "nodemailer";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = contactMessageSchema.parse(req.body);

      // Validate required environment variables
      const requiredEnvVars = [
        "SMTP_HOST",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "CONTACT_EMAIL",
      ];
      const missingEnv = requiredEnvVars.filter(
        (key) => !process.env[key] || process.env[key]?.trim() === ""
      );
      if (missingEnv.length > 0) {
        return res.status(500).json({
          success: false,
          message: `Server email configuration is incomplete. Missing: ${missingEnv.join(
            ", "
          )}`,
        });
      }

      // Create email transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
        secure:
          process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      // Verify SMTP configuration
      try {
        await transporter.verify();
      } catch (verifyError) {
        console.error("SMTP verify failed:", verifyError);
        return res.status(500).json({
          success: false,
          message:
            "Email service is not configured correctly. Please try again later.",
        });
      }

      // Email content
      const mailOptions = {
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL,
        subject: `Portfolio Contact: Message from ${validatedData.name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${validatedData.name}</p>
          <p><strong>Email:</strong> ${validatedData.email}</p>
          <p><strong>Message:</strong></p>
          <p>${validatedData.message.replace(/\n/g, "<br>")}</p>
          <hr>
          <p><em>Sent from your portfolio website contact form</em></p>
        `,
        replyTo: validatedData.email,
      };

      // Send email
      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: "Message sent successfully!",
      });
    } catch (error) {
      console.error("Contact form error:", error);

      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid form data",
          errors: error,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to send message. Please try again later.",
      });
    }
  });

  // Resume download endpoint
  app.get("/api/resume", (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const candidatePaths = [
      path.join(__dirname, "public", "resume.pdf"),
      path.resolve(__dirname, "../public/resume.pdf"),
      path.resolve(process.cwd(), "server/public/resume.pdf"),
      path.resolve(process.cwd(), "public/resume.pdf"),
    ];

    const foundPath = candidatePaths.find((p) => {
      try {
        return existsSync(p);
      } catch {
        return false;
      }
    });

    if (!foundPath) {
      console.error(
        "Resume file not found in any candidate path",
        candidatePaths
      );
      return res
        .status(404)
        .json({ success: false, message: "Resume file not found" });
    }

    res.download(foundPath, "Muhammad_Muaz_Ahmed_Resume.pdf", (err) => {
      if (err) {
        console.error("Resume download error:", err);
        res.status(500).json({
          success: false,
          message: "Failed to download resume",
        });
      }
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
