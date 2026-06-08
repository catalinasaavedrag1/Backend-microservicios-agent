import { ExampleStatus } from './ExampleStatus';

export interface ExampleProps {
  id: string;
  name: string;
  status: ExampleStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Se lanza cuando se viola una invariante o una transición de estado ilegal. */
export class InvalidExampleStateError extends Error {}

/**
 * Agregado de ejemplo (plantilla). Contiene las reglas de transición de estado;
 * no conoce nada de persistencia, HTTP ni Kafka (arquitectura limpia).
 * Reemplázalo por el agregado real de tu dominio.
 */
export class Example {
  private constructor(private readonly props: ExampleProps) {}

  static create(input: { id: string; name: string }): Example {
    if (input.name.trim().length === 0) {
      throw new InvalidExampleStateError('El nombre es obligatorio');
    }
    return new Example({ id: input.id, name: input.name, status: ExampleStatus.Draft });
  }

  static rehydrate(props: ExampleProps): Example {
    return new Example(props);
  }

  publish(): void {
    if (this.props.status === ExampleStatus.Published) {
      return; // ya está en el estado destino -> no-op idempotente
    }
    this.props.status = ExampleStatus.Published;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get status(): ExampleStatus {
    return this.props.status;
  }

  toJSON(): ExampleProps {
    return { ...this.props };
  }
}
