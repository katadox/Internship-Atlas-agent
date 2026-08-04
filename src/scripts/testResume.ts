import path from 'path';
import { resumeParserService } from '../services/ResumeParserService.js';
import { env } from '../config/env.js';

async function main() {
  console.log('\n==================================================');
  console.log('📄 ATLAS INTERNAI — RESUME PARSER & ATS MATCH TEST');
  console.log('==================================================\n');

  const resumePath = env.USER_RESUME_PATH;
  console.log(`Target Resume File: ${path.resolve(process.cwd(), resumePath)}`);

  const startTime = Date.now();
  const profile = await resumeParserService.parseResume(resumePath);
  const duration = Date.now() - startTime;

  if (profile.isParsedSuccessfully) {
    console.log('\n✅ Resume Parsing Status: SUCCESS');
    console.log(`⏱️ Parsing Duration: ${duration}ms`);
    console.log(`📊 Completeness Score: ${profile.completenessScore}%`);

    console.log('\n1. 🛠️ Extracted Skills:', profile.skills);
    console.log(`2. 🚀 Projects Extracted (${profile.projects.length}):`, JSON.stringify(profile.projects, null, 2));
    console.log(`3. 🎓 Education Extracted (${profile.education.length}):`, JSON.stringify(profile.education, null, 2));
    console.log(`4. 💼 Experience Extracted (${profile.experience.length}):`, JSON.stringify(profile.experience, null, 2));

    console.log('\n==================================================');
    console.log('🎉 Candidate Profile Ready & Verified for ATS Matching!');
    console.log('==================================================\n');
  } else {
    console.log('\n❌ Resume Parsing Status: FAILED');
    console.log(`⚠️ Reason: ${profile.parseErrorReason || 'Unknown error'}`);
    console.log('\nTips to fix:');
    console.log('1. Ensure your resume.pdf is placed at the root folder or update USER_RESUME_PATH in .env');
    console.log('2. Supported formats: .pdf, .docx, .txt, .md\n');
  }
}

main().catch((err) => {
  console.error('Fatal Resume Test Error:', err);
});
