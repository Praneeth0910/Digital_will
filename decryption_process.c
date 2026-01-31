#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define KEY 0xAA   // same key as process-1

// XOR Decryption (same as encryption)
void decryptFile(const char *input, const char *output) {
    FILE *fin = fopen(input, "rb");
    FILE *fout = fopen(output, "wb");

    if (!fin || !fout) {
        printf("File error!\n");
        exit(1);
    }

    char ch;
    while ((ch = fgetc(fin)) != EOF) {
        fputc(ch ^ KEY, fout);
    }

    fclose(fin);
    fclose(fout);
}

int main() {
    char line[200];
    char original[50], encrypted[50];

    // Step 1: Decrypt map.enc
    decryptFile("map.enc", "map.txt");

    FILE *map = fopen("map.txt", "r");
    if (!map) {
        printf("Cannot open map file\n");
        return 1;
    }

    // Step 2 & 3: Read map and decrypt files
    while (fgets(line, sizeof(line), map)) {
        sscanf(line, "%[^|]|%s", original, encrypted);
        decryptFile(encrypted, original);
        printf("Recovered: %s\n", original);
    }

    fclose(map);

    printf("PROCESS-2 completed successfully!\n");
    return 0;
}
