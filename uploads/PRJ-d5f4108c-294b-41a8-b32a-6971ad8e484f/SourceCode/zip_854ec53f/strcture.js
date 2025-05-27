project-root/
├── config/
│   ├── db.js             // Database connection
│   └── constants.js      // Constants like roles, permissions
├── controllers/
│   ├── authController.js // Authentication controller
│   ├── userController.js // User management
│   └── projectController.js // Project management
├── middleware/
│   ├── auth.js           // JWT verification
│   ├── roleCheck.js      // Permission checking
│   └── upload.js         // File upload middleware
├── models/
│   ├── userModel.js      // User schema
│   ├── projectModel.js   // Project schema
│   └── roleModel.js      // Role and permissions schema
├── routes/
│   ├── authRoutes.js     // Auth routes
│   ├── userRoutes.js     // User routes
│   └── projectRoutes.js  // Project routes
├── utils/
│   ├── idGenerator.js    // ID generation
│   ├── fileUtils.js      // File handling functions
│   └── validators.js     // Request validation
├── uploads/
│   ├── Images/
│   ├── Thumbnails/
│   └── SourceCode/
└── server.js            // Entry point