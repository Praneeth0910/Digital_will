#include <stdio.h>

// Encrypt function
void encrypt_file(char *input, char *output, unsigned char key) {
    FILE *fin = fopen(input, "rb");
    FILE *fout = fopen(output, "wb");
    unsigned char ch;

    if (fin == NULL || fout == NULL) {
        return;
    }

    while (fread(&ch, sizeof(ch), 1, fin) == 1) {
        ch = ch ^ key;
        fwrite(&ch, sizeof(ch), 1, fout);
    }

    fclose(fin);
    fclose(fout);
}

// Decrypt function (same as encrypt)
void decrypt_file(char *input, char *output, unsigned char key) {
    encrypt_file(input, output, key);
}
