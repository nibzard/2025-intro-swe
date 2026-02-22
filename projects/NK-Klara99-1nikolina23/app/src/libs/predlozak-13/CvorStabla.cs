namespace crtanje
{
    public class Cvor
    {
        // smijete dodavati varijable/polja
        // nemojte mijenjati postojeće niti konstruktor
        public int BrojID;
        public Cvor desno, lijevo;

        public Cvor(int br)
        {
            this.BrojID = br;
        }
    }
}