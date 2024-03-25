import { useState, useEffect } from 'react';
import instance from '../services/axios';
import requests from '../services/requests';

const BookData = () => {
  const [books, setBooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await instance(requests.getBooks);
        setBooks(response.data); 
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); 
  }, []);

  return books;
};

export default BookData;
