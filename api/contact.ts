import type { VercelRequest, VercelResponse } from "@vercel/node";
import { contactMessageSchema } from "./schema.js";
import nodemailer from "nodemailer";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:3000", "https://portfolio-ofki.vercel.app"];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

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

    return res.status(200).json({
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

    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
    });
  }
}
