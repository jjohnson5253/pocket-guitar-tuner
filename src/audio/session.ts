/** Invalidates in-flight permission/start work when stopped or backgrounded. */
export class CaptureSession {
  private generation = 0;
  begin() { return ++this.generation; }
  cancel() { this.generation++; }
  isCurrent(generation: number) { return this.generation === generation; }
}
