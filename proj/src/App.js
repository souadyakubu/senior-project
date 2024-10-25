import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BookSection from './components/BookSection';
import BookReader from './components/BookReader';
import books from './components/Books';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Manage login state

  return (
    <Router>
      <div className="app">
        {isLoggedIn ? (
          <>
            <Sidebar />
            <div className="content">
              <h1>Home</h1>
              <BookSection title="The Collection" books={books} />
              <Routes>
                <Route path="/book/:bookTitle" element={<BookReader />} />
              </Routes>
            </div>
          </>
        ) : (
          // Render login and signup pages if not logged in
          <Routes>
            <Route path="/" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
            <Route path="/signup" element={<Signup />} /> {/* Change 'component' to 'element' */}
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;


// // src/App.js
// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import Sidebar from './components/Sidebar';
// import BookSection from './components/BookSection';
// import BookReader from './components/BookReader';
// import books from './components/Books';
// import Login from './components/Login';  // Import your login component
// import './App.css';

// function App() {
//   return (
//     <Router>
//       <div className="app">
//         <Routes>
//           {/* Make the login page the default route */}
//           <Route path="/" element={<Login />} />

//           {/* Home route and others with sidebar */}
//           <Route
//             path="/home"
//             element={
//               <>
//                 <Sidebar />
//                 <div className="content">
//                   <h1>Home</h1>
//                   <BookSection title="The Collection" books={books} />
//                 </div>
//               </>
//             }
//           />

//           {/* Book reader route */}
//           <Route path="/book/:bookTitle" element={<BookReader />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;
