import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const companySchema = new mongoose.Schema({
    company_name: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    // omitting the rest for brief test
}, { strict: false });

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const company = await Company.findOne({ email: 'projecthari126@gmail.com' });
        if (!company) {
            console.log("Company not found");
            return;
        }
        console.log("Found company:", company.email);
        
        try {
          const isValid = await bcrypt.compare('password123', company.password || '');
          console.log("bcrypt compare result:", isValid);
        } catch (e) {
          console.error("bcrypt error:", e);
        }

    } catch (e) {
        console.error("Overall error:", e);
    } finally {
        mongoose.disconnect();
    }
}

test();
