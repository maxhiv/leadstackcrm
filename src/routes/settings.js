
import express from 'express';
const router = express.Router();
router.get('/', (req,res)=>{
  res.json({
    signature: process.env.SIGNATURE_TEXT || "— Max, 251SEO",
    bookingLink: process.env.BOOKING_LINK || "",
    fromEmail: process.env.FROM_EMAIL || "team@mail.leadstackmarketing.com",
    fromName: process.env.FROM_NAME || "Leadstack Team"
  });
});
export default router;
