import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class SecurityValidationPipe implements PipeTransform<any> {
    transform(value: any, { metatype }: ArgumentMetadata): Promise<any>;
    private toValidate;
    private sanitizeInput;
    private sanitizeString;
}
