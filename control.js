import Persona from './Persona.js';

const persona1 = new Persona(1, 'Sofia', 'Suaza', 18);
const persona2 = new Persona(2, 'Santiago', 'Garcia', 20);
const persona3 = new Persona(3, 'Diego', 'Acevedo', 19);

console.log(persona1.nombre);
persona2.setEdad(18);
console.log(persona2.edad);
console.log(persona3.apellido);

let personas = [persona1, persona2, persona3];

console.log(personas);