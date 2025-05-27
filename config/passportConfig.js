import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import User from '../models/userModel.js';
import { generateId } from '../utils/idGenerator.js';
import { ROLE_PERMISSIONS, ROLES } from '../config/constants.js';

import dotenv from 'dotenv';
dotenv.config();


// Helper function to parse full name into firstName, middleName, lastName
const parseFullName = (fullName) => {
  if (!fullName || fullName.trim() === '') {
    return { firstName: 'Unknown', middleName: '', lastName: 'User' };
  }
  const nameParts = fullName.trim().split(/\s+/).filter(part => part);
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], middleName: '', lastName: 'User' };
  }
  if (nameParts.length === 2) {
    return { firstName: nameParts[0], middleName: '', lastName: nameParts[1] };
  }
  if (nameParts.length >= 3) {
    return {
      firstName: nameParts[0],
      middleName: nameParts[1],
      lastName: nameParts[2]
    };
  }
};

// Helper function to extract country from location string
const extractCountry = (location) => {
  if (!location) return '';
  const parts = location.split(',').map(part => part.trim());
  const lastPart = parts[parts.length - 1];
  // Simple lookup for Indian cities (extend as needed)
  const indianCities = ['Nashik', 'Mumbai', 'Delhi', 'Bangalore', 'Pune'];
  if (indianCities.includes(lastPart)) return 'India';
  // Assume last part is country if not a known city
  return lastPart || '';
};

// Helper function to extract social profiles from GitHub/LinkedIn data
const extractSocialProfiles = (profile, platform) => {
  const profiles = [];
  if (platform === 'github') {
    // Always add the GitHub profile link using the username
    const githubUsername = profile.username || profile._json?.login || '';
    if (githubUsername) {
      profiles.push({
        platformName: 'GitHub',
        username: githubUsername,
        link: `https://github.com/${githubUsername}`
      });
    }
    
  } else if (platform === 'linkedin' && profile._json?.vanityName) {
    profiles.push({
      platformName: 'LinkedIn',
      username: profile._json.vanityName || profile.id,
      link: profile.profileUrl || `https://www.linkedin.com/in/${profile._json.vanityName || profile.id}`
    });
  }
  return profiles;
};

// Helper function to extract bio
const extractBio = (profile, platform) => {
  if (platform === 'github' && profile._json?.bio) {
    return profile._json.bio.slice(0, 500); // Ensure bio doesn't exceed 500 characters
  } else if (platform === 'linkedin' && profile._json?.summary) {
    return profile._json.summary.slice(0, 500); // Ensure bio doesn't exceed 500 characters
  }
  return '';
};

// Helper function to extract skills (LinkedIn only, as GitHub doesn't provide skills)
const extractSkills = (profile, platform) => {
  if (platform === 'linkedin' && profile._json?.skills) {
    return profile._json.skills.map(skill => skill.name).filter(skill => typeof skill === 'string');
  }
  return [];
};

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'Ov23liRNgjokG5DclEfw',
    clientSecret:process.env.GITHUB_CLIENT_SECRET || 'e1a5480620c48a0cf87eead75ed4c6212908e731',
    callbackURL: '/api/auth/github/callback',
    scope: ['user:email', 'user']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const githubId = profile.id.toString();
      const email = profile.emails && profile.emails[0]?.value;
      const { firstName, middleName, lastName } = parseFullName(profile.displayName || profile.username);
      const profilePictureObj = {
        name: 'profilePicture',
        url: profile.photos && profile.photos[0]?.value ? profile.photos[0].value : ''
      };
      const userCountry = extractCountry(profile._json?.location);
      const bio = extractBio(profile, 'github');
      const socialProfiles = extractSocialProfiles(profile, 'github');
      const skills = extractSkills(profile, 'github');

      // Find user by GitHub ID or email
      let user = await User.findOne({ githubId });
      if (!user && email) {
        user = await User.findOne({ email });
      }

      if (!user) {
        // Create new user
        const userId = await generateId('user');
        user = new User({
          userId,
          githubId,
          githubAccessToken: accessToken,
          email: email || null,
          firstName,
          middleName,
          lastName,
          userCountry,
          userType: '',
          phone: '',
          state: '',
          city: '',
          pincode: '',
          collegeDetails: [],
          professionalDetails: {
            teachingCollege: { collegeId: '', collegeName: '', collegeLink: '' },
            companyName: '',
            companyLink: ''
          },
          role: ROLES.USER,
          permissions: ROLE_PERMISSIONS[ROLES.USER],
          uploadedProjects: [],
          boughtProjects: [],
          uploadedFiles: [profilePictureObj],
          bio,
          skills,
          socialProfiles
        });
        await user.save();
      } else {
        // Update existing user
        user.githubId = githubId;
        user.githubAccessToken = accessToken;
        if (email && !user.email) user.email = email;
        if (!user.firstName) user.firstName = firstName;
        if (middleName && !user.middleName) user.middleName = middleName;
        if (!user.lastName) user.lastName = lastName;
        if (userCountry && !user.userCountry) user.userCountry = userCountry;
        if (bio && !user.bio) user.bio = bio;
        if (skills.length > 0 && user.skills.length === 0) user.skills = skills;
        if (socialProfiles.length > 0 && user.socialProfiles.length === 0) {
          user.socialProfiles.push(...socialProfiles);
        }
        const profilePicIndex = user.uploadedFiles.findIndex(file => file.name === 'profilePicture');
        if (profilePicIndex === -1) {
          user.uploadedFiles.push(profilePictureObj);
        } else if (profilePictureObj.url && !user.uploadedFiles[profilePicIndex].url) {
          user.uploadedFiles[profilePicIndex] = profilePictureObj;
        }
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      console.error('GitHub Strategy Error:', error.message, error.stack);
      return done(error, null);
    }
  }
));

// LinkedIn Strategy (unchanged)
passport.use(new LinkedInStrategy({
    clientID: 'your_linkedin_client_id',
    clientSecret: 'your_linkedin_client_secret',
    callbackURL: '/api/auth/linkedin/callback',
    scope: ['r_liteprofile', 'r_emailaddress']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const linkedinId = profile.id.toString();
      const email = profile.emails && profile.emails[0]?.value;
      const firstName = profile.name?.givenName || 'LinkedIn';
      const lastName = profile.name?.familyName || 'User';
      const middleName = '';
      const profilePictureObj = {
        name: 'profilePicture',
        url: profile.photos && profile.photos[0]?.value ? profile.photos[0].value : ''
      };
      const userCountry = profile._json?.localizedCountryName || '';
      const bio = extractBio(profile, 'linkedin');
      const socialProfiles = extractSocialProfiles(profile, 'linkedin');
      const skills = extractSkills(profile, 'linkedin');

      let user = await User.findOne({ linkedinId });
      if (!user && email) {
        user = await User.findOne({ email });
      }

      if (!user) {
        const userId = await generateId('user');
        user = new User({
          userId,
          linkedinId,
          linkedinAccessToken: accessToken,
          email: email || null,
          firstName,
          middleName,
          lastName,
          userCountry,
          userType: '',
          phone: '',
          state: '',
          city: '',
          pincode: '',
          collegeDetails: [],
          professionalDetails: {
            teachingCollege: { collegeId: '', collegeName: '', collegeLink: '' },
            companyName: '',
            companyLink: ''
          },
          role: ROLES.USER,
          permissions: ROLE_PERMISSIONS[ROLES.USER],
          uploadedProjects: [],
          boughtProjects: [],
          uploadedFiles: [profilePictureObj],
          bio,
          skills,
          socialProfiles
        });
        await user.save();
      } else {
        user.linkedinId = linkedinId;
        user.linkedinAccessToken = accessToken;
        if (email && !user.email) user.email = email;
        if (!user.firstName) user.firstName = firstName;
        if (middleName && !user.middleName) user.middleName = middleName;
        if (!user.lastName) user.lastName = lastName;
        if (userCountry && !user.userCountry) user.userCountry = userCountry;
        if (bio && !user.bio) user.bio = bio;
        if (skills.length > 0 && user.skills.length === 0) user.skills = skills;
        if (socialProfiles.length > 0 && user.socialProfiles.length === 0) {
          user.socialProfiles.push(...socialProfiles);
        }
        const profilePicIndex = user.uploadedFiles.findIndex(file => file.name === 'profilePicture');
        if (profilePicIndex === -1) {
          user.uploadedFiles.push(profilePictureObj);
        } else if (profilePictureObj.url && !user.uploadedFiles[profilePicIndex].url) {
          user.uploadedFiles[profilePicIndex] = profilePictureObj;
        }
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      console.error('LinkedIn Strategy Error:', error.message, error.stack);
      return done(error, null);
    }
  }
));

export default passport;