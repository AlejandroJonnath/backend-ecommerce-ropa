import {
    IsEmail,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @IsString()
    @MaxLength(100)
    firstName: string;

    @IsString()
    @MaxLength(100)
    lastName: string;

    @IsEmail()
    @MaxLength(150)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password: string;
}