'use client';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 text-gray-600 py-4 mt-8">
      <div className="container mx-auto px-4 text-center">
        <p>
          LifeSync3 &copy; {currentYear} - מרכז החיים הדיגיטלי שלך
        </p>
      </div>
    </footer>
  );
};

export default Footer; 