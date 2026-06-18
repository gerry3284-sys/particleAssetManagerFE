import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'breakEveryN'
})
export class BreakEveryNPipe implements PipeTransform {
  transform(value: string | null | undefined, n: number = 50): string {
    if (!value) return '';
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += n) {
      chunks.push(value.slice(i, i + n));
    }
    return chunks.join('\n ');
  }
}
