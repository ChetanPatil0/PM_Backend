
import { v4 as uuidv4 } from "uuid";

export const generateId = async (entityType) => {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const dateString = `${year}${month}${day}`;

    let prefix;

    switch (entityType.toLowerCase()) {
      case 'user':
        prefix = 'USR';
        break;
      case 'project':
        prefix = 'PRJ';
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    const uniquePart = uuidv4();
    const newId = `${prefix}-${uniquePart}`;
    
    return newId;
  } catch (error) {
    console.error('Error generating ID:', error);
    throw error;
  }
};
