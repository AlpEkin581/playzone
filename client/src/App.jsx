import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar    from './components/Navbar';
import Home      from './pages/Home';
import GamePage  from './pages/GamePage';
import Login     from './pages/Login';
import Register  from './pages/Register';
import './index.css';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/game/:slug"    element={<GamePage />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
