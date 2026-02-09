using System;
using System.Collections.Generic;
using System.IO;
using crtanje;

namespace PrimjerK2
{
    class Program
    {
        private static BinarnoStablo Unos(string datCvorovi)
        {
            BinarnoStablo bs = new BinarnoStablo();

            // učitaj podatke

            return bs;
        } //Unos stabla

        private static Graf UnosGrafa(string datCvorovi, string datVeze)
        {
            // datoteke!            

            Graf g = new Graf();

            // učitaj podatke

            return g;
        } //UnosGrafa

        static void Main(string[] args)
        {
            Console.Clear();
            string izbornik = File.ReadAllText("izbornik.txt");
            //podaci - datoteke su fiksne, ne morate unositi naziv
            string datCvorovi = "cvorovi.txt";
            string datVeze = "veze.txt";

            string izbor = "";

            // globalne varijable
            BinarnoStablo bs = new BinarnoStablo();
            Graf g = new Graf();

            do
            {
                Console.WriteLine(izbornik);
                izbor = Console.ReadLine();

                switch (izbor)
                {
                    case "1":
                        // unos
                        break;
                    case "i":
                        // ispis
                        break;
                    case "2":
                        // traži
                        break;
                    case "3":
                        Console.Write("Unesi broj: ");
                        int x = int.Parse(Console.ReadLine());
                        // briši
                        break;
                    case "4":
                        // unos grafa
                        // ispis
                        break;
                    case "5":
                        // max susjeda
                        // pretraga
                        break;
                    case "c":
                        Console.Clear();
                        bs.korijen.Print();
                        Console.WriteLine("Pritisni tipku...");
                        Console.ReadKey();
                        break;
                    case "0":
                        Console.WriteLine("Kraj");
                        break;
                    default:
                        Console.WriteLine("Greška");
                        break;
                }
            } while (izbor != "0");
        } // Main        

    } // class Program

}

