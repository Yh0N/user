import React, { useState, useEffect } from 'react';



const API_URL = 'http://localhost:3000/users';

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ name: '', email: '' });

  const obtenerUsuarios = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setUsuarios(data);
  };

  const crearUsuario = async () => {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoUsuario),
    });
    setNuevoUsuario({ name: '', email: '' });
    obtenerUsuarios();
  };

  const eliminarUsuario = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    obtenerUsuarios();
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      <input
        type="text"
        placeholder="Nombre"
        value={nuevoUsuario.name}
        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, name: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={nuevoUsuario.email}
        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
      />
      <button onClick={crearUsuario}>Agregar Usuario</button>

      <ul>
        {usuarios.map((usuario) => (
          <li key={usuario.id}>
            {usuario.name} - {usuario.email}
            <button onClick={() => eliminarUsuario(usuario.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
