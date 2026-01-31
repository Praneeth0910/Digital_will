#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define KEY 0xAA   // encryption key

// XOR Encryption / Decryption
void encryptFile(const char *input, const char *output) {
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

// Random filename generator
void randomName(char *name) {
    sprintf(name, "%c%c%d.enc",
            'A' + rand() % 26,
            'a' + rand() % 26,
            rand() % 1000);
}

int main() {
    char *files[3] = {"A.txt", "B.txt", "C.txt"}; //Files recieved from aditya
    char encName[50];

    FILE *map = fopen("map.txt", "w"); // saves encrypted file names and locations
    if (!map) {
        printf("Cannot create map file\n");
        return 1;
    }

    srand(time(NULL));

    // Step 1–4: Encrypt files & write map
    for (int i = 0; i < 3; i++) {
        randomName(encName);
        encryptFile(files[i], encName);
        fprintf(map, "%s|%s\n", files[i], encName);
    }

    fclose(map);

    // Step 5: Encrypt map.txt
    encryptFile("map.txt", "map.enc");

    printf("PROCESS-1 completed successfully!\n");
    return 0;
}
