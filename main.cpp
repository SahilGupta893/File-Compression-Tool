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

int main(int argc, char* argv[]) {
    Huffman h;
    std::string inputPath;

    // Check if file path is provided as command line argument
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <file_path>" << std::endl;
        std::cerr << "Example: " << argv[0] << " input.txt" << std::endl;
        return 1;
    }

    inputPath = argv[1];

    // Try to open the file
    std::ifstream inputFile(inputPath, std::ios::binary);
    if (!inputFile) {
        std::cerr << "❌ Could not open file: " << inputPath << std::endl;
        return 1;
    }

    // Read full content into string
    std::string text((std::istreambuf_iterator<char>(inputFile)), {});
    inputFile.close();

    if (text.empty()) {
        std::cerr << "❌ File is empty: " << inputPath << std::endl;
        return 1;
    }

    // Prepare file names
    std::string filename = getBaseName(inputPath);
    std::string base = getStem(filename);
    std::string ext = getExtension(filename);

    std::string outCompressed = base + ".huff";
    std::string outDecompressed = base + "_decoded" + ext;

    try {
        // Build tree and encode
        Node* root = h.buildTree(text);
        h.generateCodes(root, "");
        std::string encoded = h.encode(text);

        // Compress
        std::ofstream out(outCompressed, std::ios::binary);
        if (!out) {
            std::cerr << "❌ Could not create output file: " << outCompressed << std::endl;
            return 1;
        }
        
        saveCodes(out, h.codes);
        writeCompressed(encoded, out);
        out.close();
        std::cout << "✅ Compressed to: " << outCompressed << std::endl;

        // Decompress for verification
        std::ifstream in(outCompressed, std::ios::binary);
        if (!in) {
            std::cerr << "❌ Could not read compressed file: " << outCompressed << std::endl;
            return 1;
        }
        
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

        std::cout << "✅ Decompressed to: " << outDecompressed << std::endl;
        
        // Clean up memory
        delete decodeRoot;
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Error during compression: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
