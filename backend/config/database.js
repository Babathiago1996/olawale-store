const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const options = {
        maxPoolSize: 10,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        family: 4,
        autoIndex: process.env.NODE_ENV !== 'production',
        retryWrites: true,
        w: 'majority'
      };

      this.connection = await mongoose.connect(process.env.MONGODB_URI, options);

      console.log(`✅ MongoDB Connected: ${this.connection.connection.host}`);
      console.log(`📊 Database: ${this.connection.connection.name}`);

      // Handle connection events
      mongoose.connection.on('connected', () => {
        console.log('✅ Mongoose connected to MongoDB');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  Mongoose disconnected from MongoDB');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('✅ Mongoose connection closed');
    } catch (error) {
      console.error('❌ Error closing mongoose connection:', error);
    }
  }

  async dropDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production');
    }
    await mongoose.connection.dropDatabase();
    console.log('🗑️  Database dropped');
  }

  async createIndexes() {
    try {
      const models = mongoose.modelNames();
      for (const modelName of models) {
        const model = mongoose.model(modelName);
        await model.createIndexes();
        console.log(`✅ Indexes created for ${modelName}`);
      }
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
  }

  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState];
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();