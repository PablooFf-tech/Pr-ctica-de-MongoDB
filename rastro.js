db = db.getSiblingDB("rastro");

// ejercicio b2
db.anuncios.insertOne({
  titulo: "Bicicleta de montaña Orbea",
  descripcion: "Revisada en taller.",
  precio: 300,
  categoria: "Deporte",
  estado: "DISPONIBLE",
  ciudad: "Castellón",
  fechaPublicacion: new Date("2026-10-27"),
  visitas: 0,
  vendedor: {
    id: ObjectId("660000000000000000000004"),
    nombre: "Hugo Sanz"
  },
  fotos: [
    { url: "https://img.rastro.es/bici-1.jpg", orden: 1 }
  ],
  atributos: {
    talla: "L",
    tipo: "montaña",
    pulgadasRueda: 29
  }
});

db.anuncios.insertOne({
  titulo: "Google Pixel 7",
  descripcion: "Libre, con caja.",
  precio: 260,
  categoria: "Móviles",
  estado: "DISPONIBLE",
  ciudad: "Valencia",
  fechaPublicacion: new Date("2026-10-28"),
  visitas: 0,
  vendedor: {
    id: ObjectId("660000000000000000000005"),
    nombre: "Sara López"
  },
  fotos: [
    { url: "https://img.rastro.es/pixel-1.jpg", orden: 1 },
    { url: "https://img.rastro.es/pixel-2.jpg", orden: 2 }
  ],
  atributos: {
    marca: "Google",
    modelo: "Pixel 7",
    almacenamientoGB: 128,
    bateriaPct: 92
  }
});

// ejercicio b3.1
db.usuarios.createIndex({ email: 1 }, { unique: true });

// ejercicio b3.2
db.valoraciones.createIndex({ "autor.id": 1, anuncioId: 1 }, { unique: true });

// ejercicio b3.3
db.anuncios.createIndex({ categoria: 1, precio: 1 });

// ejercicio b3.4
db.usuarios.getIndexes();
db.valoraciones.getIndexes();
db.anuncios.getIndexes();

// ejercicio b3.5
db.anuncios.find({ categoria: "Coches" }).sort({ precio: 1 }).explain("executionStats");

// ejercicio b4.1
try {
  db.usuarios.insertOne({
    nombre: "Ana Copia",
    email: "ana@rastro.es",
    ciudad: "Valencia",
    fechaAlta: new Date(),
    favoritos: [],
    valoracionMedia: 0,
    numValoraciones: 0
  });
} catch (e) {
  print(e.message);
}

// ejercicio b4.2
try {
  db.valoraciones.insertOne({
    anuncioId: ObjectId("670000000000000000000004"),
    autor: { id: ObjectId("660000000000000000000004"), nombre: "Hugo Sanz" },
    valoradoId: ObjectId("660000000000000000000003"),
    estrellas: 1,
    comentario: "Cambio de opinión",
    fecha: new Date()
  });
} catch (e) {
  print(e.message);
}

// ejercicio b4.3
db.anuncios.insertOne({
  titulo: "Prueba fantasma",
  precio: 10,
  categoria: "Libros",
  estado: "DISPONIBLE",
  ciudad: "Valencia",
  fechaPublicacion: new Date(),
  visitas: 0,
  vendedor: { id: ObjectId("660000000000000000000099"), nombre: "Nadie" },
  fotos: [],
  atributos: {}
});

// ejercicio b4.4
db.anuncios.insertOne({
  titulo: "Prueba lámpara",
  precio: "75",
  categoria: "Muebles",
  estado: "DISPONIBLE",
  ciudad: "Valencia",
  fechaPublicacion: new Date(),
  visitas: 0,
  vendedor: { id: ObjectId("660000000000000000000001"), nombre: "Ana García" },
  fotos: [],
  atributos: { material: "metal" }
});
db.anuncios.find({ precio: { $lt: 100 } }, { titulo: 1, precio: 1, _id: 0 });

// ejercicio b4.5
try {
  db.anuncios.updateOne(
    { _id: ObjectId("670000000000000000000005") },
    { precio: 80 }
  );
} catch (e) {
  print(e.message);
}

// ejercicio b4.6
db.anuncios.findOne({ _id: "670000000000000000000003" });

db.anuncios.deleteMany({ titulo: /^Prueba/ });

// ejercicio b5.1
db.anuncios.find(
  { estado: "DISPONIBLE", ciudad: "Valencia" },
  { titulo: 1, precio: 1, _id: 0 }
).sort({ precio: 1 });

// ejercicio b5.2
db.anuncios.find({
  categoria: "Coches",
  "atributos.km": { $lt: 100000 }
});

// ejercicio b5.3
db.anuncios.find({
  categoria: "Móviles",
  "atributos.almacenamientoGB": { $gte: 128 }
});

// ejercicio b5.4
db.anuncios.find(
  { precio: { $gte: 50, $lte: 400 } },
  { titulo: 1, precio: 1, _id: 0 }
);

// ejercicio b5.5
db.anuncios.find(
  { titulo: { $regex: /nike/i } },
  { titulo: 1, _id: 0 }
);

// ejercicio b5.6
db.anuncios.find({
  "vendedor.id": ObjectId("660000000000000000000002")
});

// ejercicio b5.7
db.anuncios.find(
  { fotos: { $size: 0 } },
  { titulo: 1, _id: 0 }
);

// ejercicio b5.8
db.ofertas.find({
  estado: "PENDIENTE",
  "anuncio.id": ObjectId("670000000000000000000001")
});

// ejercicio b5.9
db.usuarios.find(
  { favoritos: ObjectId("670000000000000000000008") },
  { nombre: 1, _id: 0 }
);

// ejercicio b5.10
db.anuncios.countDocuments({ estado: "VENDIDO" });

// ejercicio b5.11
db.anuncios.find(
  {},
  { titulo: 1, visitas: 1, _id: 0 }
).sort({ visitas: -1 }).limit(3);

// ejercicio b6.1
db.anuncios.aggregate([
  { $group: { _id: "$categoria", total: { $sum: 1 } } },
  { $sort: { total: -1 } }
]);

// ejercicio b6.2
db.anuncios.aggregate([
  { $group: { _id: "$categoria", precioMedio: { $avg: "$precio" } } },
  { $sort: { precioMedio: -1 } }
]);

// ejercicio b6.3
db.anuncios.aggregate([
  { $group: { _id: "$ciudad", total: { $sum: 1 } } },
  { $sort: { total: -1 } }
]);

// ejercicio b6.4
db.anuncios.aggregate([
  { $match: { estado: "DISPONIBLE" } },
  { $group: { _id: "$vendedor.nombre", valorTotal: { $sum: "$precio" } } },
  { $sort: { valorTotal: -1 } }
]);

// ejercicio b6.5
db.anuncios.aggregate([
  { $group: { _id: "$categoria", totalVisitas: { $sum: "$visitas" } } },
  { $sort: { totalVisitas: -1 } },
  { $limit: 1 }
]);

// ejercicio b7.1
db.anuncios.find({ _id: ObjectId("670000000000000000000003") });
db.anuncios.updateOne(
  { _id: ObjectId("670000000000000000000003") },
  { $push: { fotos: { url: "https://img.rastro.es/a3-4.jpg", orden: 4 } } }
);

// ejercicio b7.2
db.anuncios.find({ _id: ObjectId("670000000000000000000005") });
db.anuncios.updateOne(
  { _id: ObjectId("670000000000000000000005") },
  { $inc: { visitas: 1 } }
);

// ejercicio b7.3
db.usuarios.find({ _id: ObjectId("660000000000000000000005") });
db.usuarios.updateOne(
  { _id: ObjectId("660000000000000000000005") },
  { $pull: { favoritos: ObjectId("670000000000000000000003") } }
);
db.usuarios.updateOne(
  { _id: ObjectId("660000000000000000000005") },
  { $addToSet: { favoritos: ObjectId("670000000000000000000002") } }
);
db.usuarios.updateOne(
  { _id: ObjectId("660000000000000000000005") },
  { $addToSet: { favoritos: ObjectId("670000000000000000000002") } }
);

// ejercicio b7.4
db.ofertas.find({ _id: ObjectId("680000000000000000000003") });
db.ofertas.updateOne(
  { _id: ObjectId("680000000000000000000003") },
  { $set: { estado: "ACEPTADA" } }
);
db.anuncios.find({ _id: ObjectId("670000000000000000000001") });
db.anuncios.updateOne(
  { _id: ObjectId("670000000000000000000001") },
  { $set: { estado: "RESERVADO" } }
);

// ejercicio b7.5
db.anuncios.find({ categoria: "Coches" });
db.anuncios.updateMany(
  { categoria: "Coches" },
  { $mul: { precio: 0.9 } }
);

// ejercicio b7.6
db.usuarios.find({ _id: ObjectId("660000000000000000000002") });
db.usuarios.updateOne(
  { _id: ObjectId("660000000000000000000002") },
  { $set: { nombre: "Luis M. Martín" } }
);
db.anuncios.find({ "vendedor.id": ObjectId("660000000000000000000002") });
db.anuncios.updateMany(
  { "vendedor.id": ObjectId("660000000000000000000002") },
  { $set: { "vendedor.nombre": "Luis M. Martín" } }
);
db.ofertas.updateMany(
  { "comprador.id": ObjectId("660000000000000000000002") },
  { $set: { "comprador.nombre": "Luis M. Martín" } }
);
db.valoraciones.updateMany(
  { "autor.id": ObjectId("660000000000000000000002") },
  { $set: { "autor.nombre": "Luis M. Martín" } }
);
