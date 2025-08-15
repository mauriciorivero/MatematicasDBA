class Persona {
    constructor(id, nombre, apellido, edad) {
        this._id = id;
        this._nombre = nombre;
        this._apellido = apellido;
        this._edad = edad;
    }

    // Getter y Setter para id
    get id() {
        return this._id;
    }
    set id(valor) {
        this._id = valor;
    }

    // Getter y Setter para nombre
    get nombre() {
        return this._nombre;
    }
    set nombre(valor) {
        this._nombre = valor;
    }

    // Getter y Setter para apellido
    get apellido() {
        return this._apellido;
    }
    set apellido(valor) {
        this._apellido = valor;
    }

    // Getter y Setter para edad
    get edad() {
        return this._edad;
    }
    set edad(valor) {
        this._edad = valor;
    }

}

export default Persona;