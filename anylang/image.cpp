#include <iostream>
#include <fstream>

using namespace std;

int main(int argc, char* argv[]) {
    if (argc < 2) {
        return 0;
    }

    string line;
    ifstream file(argv[1]);
    if (file.is_open()) {
        while(getline(file, line)) {


            //cout << line << '\n';
            
        }
        file.close();
    }



    // const char* type = argv[1];
    // int width = -1;
    // int height = -1;


    // if (type == "png") {
    //     width = *argv[2] -'0';
    //     height = *argv[3] - '0';
    //     file = argv[4];

    // } else if (type == "position") {
        
    // } else if (type == "color") {
        
    // } else if (type == "drawPixels") {
        
    // }

    return 0;


}