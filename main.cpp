#include "huffman.h"
#include <fstream>
#include <iostream>
#include <string>
#include <algorithm>

// Utility to extract file name from path
std::string getBaseName(const std::string& path) {
    size_t slash = path.find_last_of("/\\");
    return (slash == std::string::npos) ? path : path.substr(slash + 1);
}

// Utility to get filename without extension
std::string getStem(const std::string& filename) {
    size_t dot = filename.find_last_of('.');
    return (dot == std::string::npos) ? filename : filename.substr(0, dot);
}

// Utility to get extension (with dot)
std::string getExtension(const std::string& filename) {
    size_t dot = filename.find_last_of('.');
    return (dot == std::string::npos) ? "" : filename.substr(dot);
}

int main() {
    Huffman h;
    std::string inputPath;

    std::cout << "Enter the file path you want to compress: ";
    std::getline(std::cin, inputPath);

    // Try to open the file
    std::ifstream inputFile(inputPath, std::ios::binary);
    if (!inputFile) {
        std::cerr << "❌ Could not open file: " << inputPath << "\n";
        return 1;
    }

    // Read full content into string
    std::string text((std::istreambuf_iterator<char>(inputFile)), {});
    inputFile.close();

    // Prepare file names
    std::string filename = getBaseName(inputPath);
    std::string base = getStem(filename);
    std::string ext = getExtension(filename);

    std::string outCompressed = base + ".huff";
    std::string outDecompressed = base + "_decoded" + ext;

    // Build tree and encode
    Node* root = h.buildTree(text);
    h.generateCodes(root, "");
    std::string encoded = h.encode(text);

    // Compress
    std::ofstream out(outCompressed, std::ios::binary);
    saveCodes(out, h.codes);
    writeCompressed(encoded, out);
    out.close();
    std::cout << "✅ Compressed to: " << outCompressed << "\n";

    // Decompress
    std::ifstream in(outCompressed, std::ios::binary);
    auto loadedCodes = loadCodes(in);
    std::string encodedBits = readCompressed(in);
    in.close();

    // Rebuild tree from loaded codes
    Node* decodeRoot = new Node('\0', 0);
    for (auto& p : loadedCodes) {
        Node* node = decodeRoot;
        for (char bit : p.second) {
            if (bit == '0') {
                if (!node->left) node->left = new Node('\0', 0);
                node = node->left;
            } else {
                if (!node->right) node->right = new Node('\0', 0);
                node = node->right;
            }
        }
        node->ch = p.first;
    }

    // Decode and save result
    std::string decoded = h.decode(decodeRoot, encodedBits);
    std::ofstream decodedFile(outDecompressed, std::ios::binary);
    decodedFile << decoded;
    decodedFile.close();

    std::cout << "✅ Decompressed to: " << outDecompressed << "\n";
    return 0;
}
