import jwt from 'jsonwebtoken';
import 'dotenv/config'; // Garanta que o dotenv seja carregado

const secret = process.env.KEYWORD;

// Middleware de autenticação unificado e corrigido
const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ mensagem: 'Acesso negado: token ausente ou inválido no cabeçalho.' });
        }
        
        const token = authHeader.split(' ')[1];

        // jwt.verify vai lançar um erro se o token for nulo, inválido ou expirado.
        // O bloco catch cuidará disso.
        const decodedPayload = jwt.verify(token, secret);
        
        // ANEXA O PAYLOAD COMPLETO DO TOKEN EM req.user
        // O controller espera req.user.id, então o payload deve ter um campo 'id'.
        req.user = decodedPayload; 
        
        next();
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error.name, error.message);
        // Retorna um erro específico para tokens expirados
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensagem: 'Token expirado.' });
        }
        // Para outros erros (ex: token malformado)
        return res.status(401).json({ mensagem: 'Token inválido.' });
    }
};

export default auth;